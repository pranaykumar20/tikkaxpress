FROM oven/bun:1.2

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && git clone --depth 1 https://github.com/Randomblock1/cursor-openai-api.git . \
  && bun install

ENV HOST=0.0.0.0
ENV PORT=8080
ENV CURSOR_CWD=/app
ENV CURSOR_EMIT_TOOL_CALLS=false
ENV CURSOR_ENABLE_SESSIONS=true
ENV CURSOR_AUTO_SESSION=true
ENV CURSOR_ASSISTANT_TEXT_MODE=live

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

CMD ["bun", "run", "start"]
