FROM python:3.12-slim

RUN pip install --no-cache-dir pandas==2.3.3 openpyxl==3.1.5
COPY fixtures.py /fixtures.py
RUN python /fixtures.py && rm /fixtures.py

USER 65534:65534
