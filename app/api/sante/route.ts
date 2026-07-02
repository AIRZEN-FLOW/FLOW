// Point de contrôle de santé.
// Utilisé pour maintenir le service Render éveillé : un service externe gratuit
// (ex. UptimeRobot, cron-job.org) appelle cette URL toutes les 5-10 minutes,
// ce qui compte comme du trafic et empêche la mise en veille du plan gratuit.
export async function GET() {
  return Response.json({ ok: true, service: "air-zen-flow", horodatage: new Date().toISOString() });
}
