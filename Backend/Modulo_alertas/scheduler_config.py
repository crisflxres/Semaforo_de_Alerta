from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(timezone="America/Mexico_City")
scheduler.start()