# Автоматическое обновление VDS из GitHub

## Что подготовлено

Workflow после публикации обоих образов может вызвать сервер по SSH.
`deploy/deploy-release.sh` устанавливается на VDS как
`/usr/local/sbin/job-crm-deploy`. Он использует существующие файлы в
`/opt/job-crm`, сохраняет домен, порты, секреты и volumes.
Скрипт скачивает образы, закрепляет их digest, блокирует параллельные
обновления, останавливает web/API, делает копию БД, применяет миграции
и запускает новую версию. PostgreSQL не пересоздаётся.

Это подготовленная конфигурация, а не подтверждение настройки сервера.
В этом сеансе проверены workflow, синтаксис и семь сценариев с подставным
Docker (успех, ошибки скачивания/копирования/миграций/HTTPS, старый релиз,
занятая блокировка). Они не проверяют реальный Docker, SSH и systemd;
реальное обновление из Actions
нужно проверить после выполнения инструкции. При изменении Compose или
серверных скриптов их нужно отдельно установить на VDS: workflow обновляет
только образы приложения.

## 1. Передать скрипты с компьютера

PowerShell, из папки проекта, используя свой существующий SSH-доступ:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup
scp deploy/deploy-release.sh deploy/ssh-deploy-command.sh root@135.106.220.160:/root/
```

Если для входа требуется явно указать личный ключ, добавь к `scp`
`-i "$env:USERPROFILE/.ssh/selectel_crm"`.

На VDS в текущей root-консоли установи оба скрипта
(это тот же блок, который был приведён в чате):

```bash
sed -i 's/\r$//' /root/deploy-release.sh /root/ssh-deploy-command.sh
bash -n /root/deploy-release.sh
bash -n /root/ssh-deploy-command.sh
install -o root -g root -m 0700 /root/deploy-release.sh /usr/local/sbin/job-crm-deploy
install -o root -g root -m 0700 /root/ssh-deploy-command.sh /usr/local/sbin/job-crm-ssh
```

Файлы получают короткие имена при установке:
`deploy-release.sh` → `job-crm-deploy` (обновление приложения),
`ssh-deploy-command.sh` → `job-crm-ssh` (проверка разрешённой SSH-команды).
`bash -n` проверяет синтаксис, но не запускает деплой.

Затем отдельно настрой права файлов Compose и проверь наличие утилит.
Этот блок не был включён в предыдущее сообщение чата. Если установка выше
уже выполнена, продолжай отсюда:

```bash
chown root:root /opt/job-crm /opt/job-crm/compose.production.yaml /opt/job-crm/compose.ghcr.yaml
chmod 0755 /opt/job-crm
chmod 0600 /opt/job-crm/compose.production.yaml /opt/job-crm/compose.ghcr.yaml
command -v docker flock systemd-run curl
```

Не переходи дальше при ошибке. Эти команды сайт не перезапускают.

## 2. Создать отдельный ключ для GitHub

На своём компьютере, PowerShell:

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE/.ssh/job_crm_github" -C "github-actions-job-crm"
```

На запрос passphrase нажми Enter дважды: автоматический процесс не сможет
ввести пароль ключа. Если файл уже существует, не перезаписывай его вслепую.
Это отдельный ключ, личный `selectel_crm` в GitHub не загружаем.

Передай только публичную часть:

```powershell
scp "$env:USERPROFILE/.ssh/job_crm_github.pub" root@135.106.220.160:/root/job_crm_github.pub
```

На VDS добавь ограниченный доступ (выполнить один раз):

```bash
install -d -m 0700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 0600 /root/.ssh/authorized_keys
printf '\nrestrict,command="/usr/local/sbin/job-crm-ssh" %s\n' "$(cat /root/job_crm_github.pub)" >> /root/.ssh/authorized_keys
```

Ключ входит как root, но может вызвать только `check` или `deploy <тег>`.
Командная оболочка и перенаправление портов для этого ключа запрещены.
Это всё равно привилегированный доступ к обновлению приложения: доверяй
только проверенному коду в main и защищай приватную часть ключа.

Проверь с компьютера:

```powershell
ssh -i "$env:USERPROFILE/.ssh/job_crm_github" -o IdentitiesOnly=yes root@135.106.220.160 check
```

Ожидается `Deployment SSH access is ready.` Это ещё не деплой.

## 3. Подготовить проверку подлинности сервера

В уже доверенной SSH-консоли VDS:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
awk '{print "135.106.220.160 " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
```

Вторая команда выводит строку known_hosts вида
`135.106.220.160 ssh-ed25519 AAAA...`. Её нужно сохранить в GitHub.
Не получать её автоматически через непроверенный ssh-keyscan при деплое.

## 4. Настроить GitHub

Репозиторий → Settings → Environments → создай `production`.
Ограничь Deployment branches and tags веткой `main`.
В Environment secrets добавь:

| Имя | Значение |
| --- | --- |
| `VDS_SSH_KEY` | Полное содержимое приватного `job_crm_github`, включая BEGIN/END |
| `VDS_KNOWN_HOSTS` | Строка публичного ключа сервера из шага 3 |

Приватный ключ копируй в интерфейс GitHub самостоятельно, в чат не присылай.
Файл с `.pub` для `VDS_SSH_KEY` не подходит.
Пароли PostgreSQL и сайта остаются на VDS.

`AUTO_DEPLOY` пока не создавай: push будет только собирать и публиковать образы.
Образы у нас уже скачиваются сервером. Если их видимость изменится на приватную,
потребуется отдельно настроить root-доступ Docker к GHCR только на чтение.

## 5. Проверить восстановление резервной копии

До включения автоматики восстанови имеющуюся копию в отдельный тестовый
контейнер PostgreSQL с собственным volume/каталогом, без публичного порта,
и проверь таблицы и данные. Никогда не восстанавливай проверочную копию
поверх рабочей базы. Если такая проверка ещё не выполнена, проведём её
отдельным шагом перед первым автоматическим обновлением.

## 6. Отправить изменения и выполнить первый запуск

На компьютере:

```powershell
git add .github/workflows/release.yml deploy/deploy-release.sh deploy/ssh-deploy-command.sh deploy/tests/test_deploy.py docs/github-actions-vds-deploy.md
git diff --cached --stat
git commit -m "ci: add controlled VDS deployment over SSH"
git push
```

После появления изменений в main: Actions → CI and images → Run workflow →
ветка main → включить `Update the VDS after publishing images` → Run workflow.
Этот запуск реально обновляет сайт с коротким простоем.
Шаг Deploy to VDS ждёт успешной публикации обоих образов.

Проверь зелёный Deploy to VDS, вход на сайт, загрузку вакансий и сохранность
данных. Проверка 401 подтверждает внешний HTTPS и парольную защиту;
отдельно сервер проверяет API с обращением к БД. Они не заменяют проверку UI.

После успешной проверки: Settings → Secrets and variables → Actions →
Variables → New repository variable: `AUTO_DEPLOY` со значением `true`.
Теперь push в main выполняет весь цикл, включая обновление VDS.
Чтобы выключить автоматические обновления, удали эту переменную или поставь
`false`. Уже начатый серверный процесс это не отменит.

## Ошибки, журнал и откат

На VDS:

```bash
systemctl list-units --all 'job-crm-deploy-*'
journalctl --no-pager -n 200 -u 'job-crm-deploy-*'
cat /var/lib/job-crm/current-release
```

Скрипт работает как отдельная служба systemd, поэтому разрыв SSH не прерывает
миграцию. Если GitHub сообщает ошибку связи, сначала проверь серверный журнал.
Не запускай второй деплой вслепую; серверная блокировка также запрещает
одновременное обновление. Более старый номер запуска автоматически отклоняется.

До остановки приложения ошибка не затрагивает работающий сайт. При ошибке
резервного копирования скрипт пытается запустить прежнюю версию. После начала
миграций автоматического отката нет: старая версия может быть несовместима
с новой схемой. При ошибке сайт может оставаться остановленным.

Каталог `/var/lib/job-crm/release-<тег>-...` содержит `previous.yaml`,
`candidate.yaml`, снимок настроек и `database.dump` (если копия завершилась).
Копии не удаляются автоматически; следи за свободным местом и храни отдельную
копию вне VDS. Чтение оглавления дампа при деплое не заменяет пробное восстановление.

Если совместимость старого приложения с текущей схемой подтверждена, при
отсутствии активного деплоя восстанови прежний выбор образов:

```bash
# Подставь точный каталог из журнала неудачного обновления.
RECOVERY=/var/lib/job-crm/release-ЗАМЕНИТЬ
cd /opt/job-crm
test -s "$RECOVERY/previous.yaml" && cp "$RECOVERY/previous.yaml" compose.ghcr.yaml
docker compose --env-file /etc/job-crm/production.env -f compose.production.yaml -f compose.ghcr.yaml up -d --no-deps --no-build --pull never --wait --wait-timeout 180 api web
```

Это возвращает образы, не базу. Дамп не восстанавливается автоматически,
чтобы не потерять данные после резервного копирования. После ручного отката
`current-release` остаётся записью последнего успешного автоматического запуска;
фактически работающие образы смотри через Compose `ps`.

Справка: [concurrency GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
