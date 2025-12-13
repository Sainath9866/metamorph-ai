FROM kestra/kestra:v0.15.0

# Install the OpenAI plugin
RUN /app/kestra plugins install io.kestra.plugin:plugin-openai:0.15.0

# Install the Docker plugin for running containers
RUN /app/kestra plugins install io.kestra.plugin:plugin-docker:0.15.0

# Expose ports
EXPOSE 8080 8081
