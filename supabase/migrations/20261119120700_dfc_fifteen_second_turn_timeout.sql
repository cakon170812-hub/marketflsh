UPDATE public.rf_domino_configs
SET turn_seconds = 15
WHERE turn_seconds IS DISTINCT FROM 15;

ALTER TABLE public.rf_domino_configs
ALTER COLUMN turn_seconds SET DEFAULT 15;

SELECT cron.alter_job(job_id := jobid, schedule := '1 second')
FROM cron.job
WHERE jobname = 'dfc-z11-turn-watchdog';
