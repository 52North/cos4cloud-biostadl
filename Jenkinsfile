pipeline {
  agent {
    docker {
      image 'node:14-alpine'
      args '''-u "node"
-p 3000:3000'''
    }

  }
  stages {
    stage('Build Loader') {
      steps {
        sh '''cd biostadl
npm install
npm run build'''
      }
    }

  }
}