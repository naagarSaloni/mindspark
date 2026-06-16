 import { useEffect, useState } from "react"

const API = "https://mindspark-backend-264v.onrender.com/api"

function AdminPanel() {
  const [users, setUsers] = useState([])

  const [teacherIds, setTeacherIds] = useState([])
  const [studentIds, setStudentIds] = useState([])

  const [newTeacherId, setNewTeacherId] = useState("")
  const [newStudentId, setNewStudentId] = useState("")

  const fetchUsers = async () => {
    const res = await fetch(`${API}/admin/users`)
    const data = await res.json()
    setUsers(data)
  }

  const fetchTeacherIds = async () => {
    const res = await fetch(`${API}/admin/teacher-ids`)
    const data = await res.json()
    setTeacherIds(data)
  }

  const fetchStudentIds = async () => {
    const res = await fetch(`${API}/admin/student-ids`)
    const data = await res.json()
    setStudentIds(data)
  }

  const refreshAll = () => {
    fetchUsers()
    fetchTeacherIds()
    fetchStudentIds()
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const deleteUser = async (id) => {
    await fetch(`${API}/admin/delete-user/${id}`, {
      method: "DELETE",
    })
    refreshAll()
  }

  const blockUser = async (id) => {
    await fetch(`${API}/admin/block/${id}`, {
      method: "PUT",
    })
    refreshAll()
  }

  const unblockUser = async (id) => {
    await fetch(`${API}/admin/unblock/${id}`, {
      method: "PUT",
    })
    refreshAll()
  }

  const addTeacherId = async () => {
    if (!newTeacherId.trim()) return

    await fetch(
      `${API}/admin/teacher-ids/${newTeacherId}`,
      {
        method: "POST",
      }
    )

    setNewTeacherId("")
    fetchTeacherIds()
  }

  const addStudentId = async () => {
    if (!newStudentId.trim()) return

    await fetch(
      `${API}/admin/student-ids/${newStudentId}`,
      {
        method: "POST",
      }
    )

    setNewStudentId("")
    fetchStudentIds()
  }

  const deleteTeacherId = async (id) => {
    await fetch(`${API}/admin/teacher-ids/${id}`, {
      method: "DELETE",
    })

    fetchTeacherIds()
  }

  const deleteStudentId = async (id) => {
    await fetch(`${API}/admin/student-ids/${id}`, {
      method: "DELETE",
    })

    fetchStudentIds()
  }

  const teachers = users.filter(
    (u) => u.role === "teacher"
  )

  const students = users.filter(
    (u) => u.role === "student"
  )

  return (
    <main className="page container admin-page">

      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">
            Manage teachers, students and approved IDs
          </p>
        </div>
      </div>

      <div className="admin-grid">

        <div className="admin-stat">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>

        <div className="admin-stat">
          <h3>{teachers.length}</h3>
          <p>Teachers</p>
        </div>

        <div className="admin-stat">
          <h3>{students.length}</h3>
          <p>Students</p>
        </div>

      </div>

      {/* APPROVED IDS */}

      <div className="admin-section">
        <h3>Approved Teacher IDs</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            placeholder="Enter Teacher ID"
            value={newTeacherId}
            onChange={(e) =>
              setNewTeacherId(e.target.value)
            }
          />

          <button
            className="button"
            onClick={addTeacherId}
          >
            Add
          </button>
        </div>

        {teacherIds.map((item) => (
          <div
            key={item.id}
            className="question-card"
          >
            <strong>{item.teacher_id}</strong>

            <button
              className="btn-delete"
              onClick={() =>
                deleteTeacherId(item.id)
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h3>Approved Student IDs</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            placeholder="Enter Admission Number"
            value={newStudentId}
            onChange={(e) =>
              setNewStudentId(e.target.value)
            }
          />

          <button
            className="button"
            onClick={addStudentId}
          >
            Add
          </button>
        </div>

        {studentIds.map((item) => (
          <div
            key={item.id}
            className="question-card"
          >
            <strong>{item.admission_no}</strong>

            <button
              className="btn-delete"
              onClick={() =>
                deleteStudentId(item.id)
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* TEACHERS */}

      <div className="admin-section">
        <h3>Teachers</h3>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.username}</td>
                <td>{user.unique_id}</td>

                <td>
                  {user.is_blocked
                    ? "Blocked"
                    : "Active"}
                </td>

                <td>
                  <div className="admin-actions">

                    <button
                      className="btn-block"
                      onClick={() =>
                        blockUser(user.id)
                      }
                    >
                      Block
                    </button>

                    <button
                      className="btn-unblock"
                      onClick={() =>
                        unblockUser(user.id)
                      }
                    >
                      Unblock
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() =>
                        deleteUser(user.id)
                      }
                    >
                      Delete
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STUDENTS */}

      <div className="admin-section">
        <h3>Students</h3>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.username}</td>
                <td>{user.unique_id}</td>

                <td>
                  {user.is_blocked
                    ? "Blocked"
                    : "Active"}
                </td>

                <td>
                  <div className="admin-actions">

                    <button
                      className="btn-block"
                      onClick={() =>
                        blockUser(user.id)
                      }
                    >
                      Block
                    </button>

                    <button
                      className="btn-unblock"
                      onClick={() =>
                        unblockUser(user.id)
                      }
                    >
                      Unblock
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() =>
                        deleteUser(user.id)
                      }
                    >
                      Delete
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </main>
  )
}

export default AdminPanel