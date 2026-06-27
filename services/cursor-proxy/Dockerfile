FROM oven/bun:1.2-alpine

WORKDIR /app

RUN apk add --no-cache git \
  && git clone --depth 1 https://github.com/Randomblock1/cursor-openai-api.git . \
  && bun install

ENV HOST=0.0.0.0
ENV PORT=8080
ENV CURSOR_CWD=/app
ENV CURSOR_EMIT_TOOL_CALLS=true
ENV CURSOR_ENABLE_SESSIONS=true
ENV CURSOR_AUTO_SESSION=true

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["bun", "run", "start"]
