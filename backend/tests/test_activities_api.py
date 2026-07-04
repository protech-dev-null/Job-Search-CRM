from fastapi.testclient import TestClient


def create_vacancy(client: TestClient) -> str:
    """Create a vacancy and return its identifier."""
    response = client.post(
        "/api/vacancies",
        json={"company": "Orbit Labs", "position": "Python Developer"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_activity_crud(client: TestClient) -> None:
    """Create, list, update, and delete a vacancy activity."""
    vacancy_id = create_vacancy(client)

    create_response = client.post(
        f"/api/vacancies/{vacancy_id}/activities",
        json={
            "kind": "interview",
            "description": "Technical interview scheduled",
        },
    )

    assert create_response.status_code == 201
    activity = create_response.json()
    assert activity["vacancy_id"] == vacancy_id
    assert activity["kind"] == "interview"
    assert activity["occurred_at"]

    list_response = client.get(f"/api/vacancies/{vacancy_id}/activities")
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [activity["id"]]

    update_response = client.patch(
        f"/api/vacancies/{vacancy_id}/activities/{activity['id']}",
        json={"description": "Technical interview completed"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["description"] == "Technical interview completed"

    delete_response = client.delete(
        f"/api/vacancies/{vacancy_id}/activities/{activity['id']}"
    )
    assert delete_response.status_code == 204
    assert client.get(f"/api/vacancies/{vacancy_id}/activities").json() == []


def test_activity_requires_existing_vacancy(client: TestClient) -> None:
    """Reject activity operations for an unknown vacancy."""
    response = client.post(
        "/api/vacancies/missing-id/activities",
        json={"kind": "note", "description": "Missing vacancy"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vacancy not found"
