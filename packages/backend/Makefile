init:
	yarn
	gcloud config set project a42-dev
	gcloud auth configure-docker
	gcloud config set run/platform managed
	gcloud config set run/region us-west1

build:
	docker build --platform linux/amd64 -t a42-dev/api-ethonline2022 .


tag:
	docker tag a42-dev/api-ethonline2022:latest gcr.io/a42-dev/api-ethonline2022


push:
	docker push gcr.io/a42-dev/api-ethonline2022


init-deploy:
	gcloud run deploy api-ethonline2022 --image gcr.io/a42-dev/api-ethonline2022 --platform managed --region us-west1 \
   	--update-env-vars FIREBASE_SECRET_PATH=/etc/secrets/firebase.json,PROJECT_ID=a42-dev \
   	--update-env-vars SESSION_EXPIRE=7d,JWT_ALGORITHM=HS256 \
	--update-secrets /etc/secrets/firebase.json=FIREBASE_SECRET_JSON:latest,JWT_SECRET=JWT_SECRET:latest \
	--update-secrets ALCHEMY_MAINNET_API_KEY=ALCHEMY_MAINNET_API_KEY:latest,ALCHEMY_MATIC_API_KEY=ALCHEMY_MATIC_API_KEY:latest \
	--update-secrets ALCHEMY_OPTIMISM_API_KEY=ALCHEMY_OPTIMISM_API_KEY:latest,ALCHEMY_ARBITRUM_API_KEY=ALCHEMY_ARBITRUM_API_KEY:latest \



deploy:
	gcloud run deploy api-ethonline2022 --image gcr.io/a42-dev/api-ethonline2022 --platform managed

go:
	make build
	make tag
	make push
	make init-deploy
