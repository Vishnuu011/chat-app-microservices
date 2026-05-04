import { userClient } from './apiClient.js'

export const userAPI = {
  sendOTP:    (email)        => userClient.post('/login',       { email }),
  verifyOTP:  (email, otp)   => userClient.post('/verify',      { email, otp }),
  myProfile:  ()             => userClient.get('/me'),
  updateName: (name)         => userClient.post('/update/user', { name }),
  getAllUsers: ()             => userClient.get('/user/all'),
  getUser:    (id)           => userClient.get(`/user/${id}`),

  // Public key endpoints (add to your backend user service)
  uploadPublicKey: (publicKey) =>
    userClient.post('/public-key', { publicKey }),
  getPublicKey: (userId) =>
    userClient.get(`/public-key/${userId}`),
}
