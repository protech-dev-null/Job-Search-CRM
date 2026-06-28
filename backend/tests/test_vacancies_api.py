from fastapi.testclient import TestClient


def create_filter_test_vacancies(client: TestClient) -> None:
    """Create a compact vacancy set used by list filter tests."""
    vacancies = [
        {
            "company": "Orbit Labs",
            "position": "React Developer",
            "location": "Remote",
            "source": "hh",
            "status": "applied",
            "priority": "high",
            "work_format": "remote",
            "skills": ["React", "TypeScript"],
        },
        {
            "company": "CloudFox",
            "position": "Python Backend Developer",
            "location": "Moscow",
            "source": "linkedin",
            "status": "interview",
            "priority": "medium",
            "work_format": "hybrid",
            "skills": ["Python", "FastAPI"],
        },
        {
            "company": "Marketly",
            "position": "UI Developer",
            "location": "Saint Petersburg",
            "source": "telegram",
            "status": "applied",
            "priority": "high",
            "work_format": "remote",
            "skills": ["React", "Tailwind CSS"],
        },
    ]
    for vacancy in vacancies:
        response = client.post("/api/vacancies", json=vacancy)
        assert response.status_code == 201


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
    data = response.json()
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["pages"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["company"] == "CloudFox"


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


def test_filter_vacancies_by_status_and_priority(client: TestClient) -> None:
    create_filter_test_vacancies(client)

    response = client.get("/api/vacancies?status=applied&priority=high")

    assert response.status_code == 200
    assert {vacancy["company"] for vacancy in response.json()["items"]} == {
        "Orbit Labs",
        "Marketly",
    }


def test_filter_vacancies_by_work_format_and_source(client: TestClient) -> None:
    create_filter_test_vacancies(client)

    response = client.get("/api/vacancies?work_format=hybrid&source=linkedin")

    assert response.status_code == 200
    assert [vacancy["company"] for vacancy in response.json()["items"]] == ["CloudFox"]


def test_search_vacancies_is_case_insensitive(client: TestClient) -> None:
    create_filter_test_vacancies(client)

    response = client.get("/api/vacancies?search=mosCOW")

    assert response.status_code == 200
    assert [vacancy["company"] for vacancy in response.json()["items"]] == ["CloudFox"]


def test_filter_vacancies_by_skill_is_case_insensitive(client: TestClient) -> None:
    create_filter_test_vacancies(client)

    response = client.get("/api/vacancies?skill=react")

    assert response.status_code == 200
    assert {vacancy["company"] for vacancy in response.json()["items"]} == {
        "Orbit Labs",
        "Marketly",
    }


def test_rejects_invalid_vacancy_filters(client: TestClient) -> None:
    invalid_status_response = client.get("/api/vacancies?status=unknown")
    blank_skill_response = client.get("/api/vacancies?skill=%20%20")

    assert invalid_status_response.status_code == 422
    assert blank_skill_response.status_code == 422


def test_paginate_vacancies(client: TestClient) -> None:
    """Return requested page together with pagination metadata."""
    for index in range(5):
        response = client.post(
            "/api/vacancies",
            json={
                "company": f"Company {index}",
                "position": "Python Developer",
            },
        )
        assert response.status_code == 201

    response = client.get("/api/vacancies?page=2&page_size=2")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 2
    assert data["page_size"] == 2
    assert data["pages"] == 3
    assert len(data["items"]) == 2


def test_paginate_after_filtering_by_skill(client: TestClient) -> None:
    """Apply the skill filter before calculating and slicing pages."""
    create_filter_test_vacancies(client)

    response = client.get("/api/vacancies?skill=react&page=2&page_size=1")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["pages"] == 2
    assert len(data["items"]) == 1
    assert data["items"][0]["company"] == "Orbit Labs"


def test_rejects_invalid_pagination(client: TestClient) -> None:
    """Reject page numbers and page sizes outside supported bounds."""
    invalid_page_response = client.get("/api/vacancies?page=0")
    invalid_page_size_response = client.get("/api/vacancies?page_size=101")

    assert invalid_page_response.status_code == 422
    assert invalid_page_size_response.status_code == 422
