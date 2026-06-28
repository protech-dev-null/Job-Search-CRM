from fastapi.testclient import TestClient


def test_stats_for_empty_database(client: TestClient) -> None:
    response = client.get("/api/stats")

    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "by_status": {
            "interesting": 0,
            "applied": 0,
            "interview": 0,
            "test": 0,
            "offer": 0,
            "rejected": 0,
            "archived": 0,
        },
        "by_priority": {
            "low": 0,
            "medium": 0,
            "high": 0,
        },
        "top_skills": [],
    }


def test_stats_aggregate_vacancies(client: TestClient) -> None:
    vacancies = [
        {
            "company": "Orbit Labs",
            "position": "React Developer",
            "status": "applied",
            "priority": "high",
            "skills": ["React", "React", "TypeScript"],
        },
        {
            "company": "CloudFox",
            "position": "Frontend Intern",
            "status": "interview",
            "priority": "high",
            "skills": ["React", "CSS"],
        },
        {
            "company": "DataWorks",
            "position": "Python Developer",
            "status": "rejected",
            "priority": "low",
            "skills": ["Python"],
        },
    ]
    for vacancy in vacancies:
        create_response = client.post("/api/vacancies", json=vacancy)
        assert create_response.status_code == 201

    response = client.get("/api/stats")

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 3
    assert data["by_status"] == {
        "interesting": 0,
        "applied": 1,
        "interview": 1,
        "test": 0,
        "offer": 0,
        "rejected": 1,
        "archived": 0,
    }
    assert data["by_priority"] == {
        "low": 1,
        "medium": 0,
        "high": 2,
    }
    assert data["top_skills"] == [
        {"name": "React", "count": 2},
        {"name": "CSS", "count": 1},
        {"name": "Python", "count": 1},
        {"name": "TypeScript", "count": 1},
    ]
