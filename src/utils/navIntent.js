// Lightweight cross-screen navigation intent (no router in this app).
// Dashboard sets this right before switching tabs; WorkoutsScreen consumes
// it once on mount to deep-link straight into the gym/workout of the day.
let pendingIntent = null

export function setWorkoutIntent(gym, workout) {
  pendingIntent = { gym, workout }
}

export function consumeWorkoutIntent() {
  const intent = pendingIntent
  pendingIntent = null
  return intent
}
