FROM loadimpact/k6:latest
USER root
RUN apk add --no-cache bash curl
USER 12345
WORKDIR /home/k6
ADD ./entry.sh ./
ADD ./ /load/
EXPOSE 6565/tcp
ENTRYPOINT [ "./entry.sh" ]