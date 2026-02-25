# Optimized Dockerfile for nanobot
# Uses multi-stage build to reduce image size and improve security

# Build stage
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files
COPY pyproject.toml README.md LICENSE ./
COPY nanobot/ ./nanobot/

# Install dependencies with caching
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache -e .

# Production stage
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS production

# Install runtime dependencies including Node.js for WhatsApp bridge
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python*/site-packages /usr/local/lib/python*/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY nanobot/ ./nanobot/

# Create non-root user for security
RUN groupadd -r nanobot && useradd -r -g nanobot nanobot && \
    mkdir -p /home/nanobot/.nanobot && \
    chown -R nanobot:nanobot /home/nanobot && \
    chown -R nanobot:nanobot /app

USER nanobot

# Create config directory
RUN mkdir -p /home/nanobot/.nanobot

# Expose ports
EXPOSE 18790 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD nanobot status || exit 1

ENTRYPOINT ["nanobot"]
CMD ["status"]