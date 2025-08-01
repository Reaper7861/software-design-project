import React, { useEffect, useState } from 'react';
import {
  Typography, CircularProgress, Box,
  Select, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const UserList = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(getAuth(), (user) => {
      setUser(user || null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No authenticated user found.');
          setLoading(false);
          return;
        }
        const token = await currentUser.getIdToken();
        const res = await fetch('http://localhost:8080/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.users || data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`http://localhost:8080/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(`Failed to update role: ${errMsg}`);
      }
      const result = await res.json();
      console.log(result.message);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err.message);
    }
  };

  const columns = [
    { field: 'fullName', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      renderCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) => handleRoleChange(params.row.uid, e.target.value)}
          variant="standard"
          disableUnderline
        >
          <MenuItem value="administrator">Admin</MenuItem>
          <MenuItem value="volunteer">Volunteer</MenuItem>
        </Select>
      ),
    },
  ];

  const rows = Array.isArray(users)
    ? users.map(u => ({
        id: u.uid,
        fullName: u.fullName,
        email: u?.email || 'N/A',
        role: u.role || 'volunteer',
        uid: u.uid,
      }))
    : [];

  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, mb: 6 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>User Management</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSize={10}
        />
      )}
    </Box>
  );
};

export default UserList;