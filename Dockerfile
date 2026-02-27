# Use Python 3.13 as base
FROM python:3.13-slim

# Install Node.js (Version 22) and unzip
RUN apt-get update && apt-get install -y curl unzip && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy the rest of the code
COPY . .

# Unzip the pre-indexed Quran data
RUN unzip quran_indexed.zip && rm quran_indexed.zip

# Expose ports for Django and Frontend
EXPOSE 8000
EXPOSE 3000

# Run migrations, then start Django in background and Frontend in foreground
# Note: --host 0.0.0.0 is required for Vite to be accessible from outside the container
CMD ["sh", "-c", "python manage.py migrate && (python manage.py runserver 0.0.0.0:8000 &) && cd frontend && npm run dev -- --port 3000 --host 0.0.0.0"]
