FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libatomic1 && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/app ./app
COPY prisma ./prisma
COPY apps/api/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENV API_HOST=0.0.0.0
ENV API_PORT=8000

ENTRYPOINT ["/app/entrypoint.sh"]

