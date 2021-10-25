NAME=${NAME:=k6-test}

helm upgrade ${NAME} ./k8s \
      --install \
      --namespace adapters \
      --create-namespace \
      --set image.tag=latest \
      --set name=${NAME} \
      --wait

# helm uninstall ${NAME} \
#       --namespace adapters \
#       --wait