from fastapi.testclient import TestClient


def test_create_vacancy(client: TestClient) -> None:
    response = client.post(
        "/api/vacancies",
        json={
            "company": "Orbit Labs",
            "position": "React Developer",
            "source": "hh",
            "status": "applied",
            "priority": "high",
            "work_format": "remote",
            "skills": ["React", "TypeScript"],
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["id"]
    assert data["company"] == "Orbit Labs"
    assert data["position"] == "React Developer"
    assert data["source"] == "hh"
    assert data["status"] == "applied"
    assert data["priority"] == "high"
    assert data["work_format"] == "remote"
    assert data["skills"] == ["React", "TypeScript"]
    assert data["created_at"]
    assert data["updated_at"]


def test_list_vacancies(client: TestClient) -> None:
    client.post(
        "/api/vacancies",
        json={
            "company": "CloudFox",
            "position": "Frontend Intern",
            "skills": ["JavaScript", "CSS"],
        },
    )

    response = client.get("/api/vacancies")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["company"] == "CloudFox"


def test_read_vacancy(client: TestClient) -> None:
    create_response = client.post(
        "/api/vacancies",
        json={
            "company": "Marketly",
            "position": "UI Developer",
        },
    )
    vacancy_id = create_response.json()["id"]

    response = client.get(f"/api/vacancies/{vacancy_id}")

    assert response.status_code == 200
    assert response.json()["id"] == vacancy_id
    assert response.json()["company"] == "Marketly"


def test_update_vacancy(client: TestClient) -> None:
    create_response = client.post(
        "/api/vacancies",
        json={
            "company": "Northwind",
            "position": "Frontend Developer",
        },
    )
    vacancy_id = create_response.json()["id"]

    response = client.patch(
        f"/api/vacancies/{vacancy_id}",
        json={
            "status": "interview",
            "notes": "Prepare questions for HR call.",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "interview"
    assert response.json()["notes"] == "Prepare questions for HR call."


def test_delete_vacancy(client: TestClient) -> None:
    create_response = client.post(
        "/api/vacancies",
        json={
            "company": "BrightApps",
            "position": "Frontend Trainee",
        },
    )
    vacancy_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/vacancies/{vacancy_id}")
    read_response = client.get(f"/api/vacancies/{vacancy_id}")

    assert delete_response.status_code == 204
    assert read_response.status_code == 404


def test_vacancy_not_found(client: TestClient) -> None:
    response = client.get("/api/vacancies/missing-id")

    assert response.status_code == 404
    assert response.json()["detail"] == "Vacancy not found"
