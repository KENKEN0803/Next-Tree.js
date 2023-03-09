docker pull node:18.15.0

docker build -t lg_3d_nextjs .

docker tag lg_3d_nextjs:latest 375442000859.dkr.ecr.ap-northeast-2.amazonaws.com/lg_3d_nextjs:latest

aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 375442000859.dkr.ecr.ap-northeast-2.amazonaws.com

docker push 375442000859.dkr.ecr.ap-northeast-2.amazonaws.com/lg_3d_nextjs:latest

aws ecs update-service --cluster lg_3d_nextjs_cluster --service lg_3d_nextjs_service_arm64 --force-new-deployment --region ap-northeast-2 > /dev/null 2>&1

docker rmi lg_3d_nextjs:latest 375442000859.dkr.ecr.ap-northeast-2.amazonaws.com/lg_3d_nextjs:latest
