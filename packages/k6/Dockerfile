FROM loadimpact/k6:latest
USER root
RUN apk add --no-cache bash
USER 12345
WORKDIR /home/k6
ADD ./entry.sh ./
ENTRYPOINT [ "./entry.sh" ]