FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr poppler-utils \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 rozgaar && install -d -o rozgaar -g rozgaar /data
WORKDIR /app
COPY . .
USER rozgaar
ENV HOST=0.0.0.0 PORT=8000 ROZGAAR_DATA_DIR=/data
EXPOSE 8000
CMD ["python3", "server.py"]
