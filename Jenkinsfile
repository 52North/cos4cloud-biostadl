pipeline {
  agent {
    docker {
      image 'node:12-alpine3.12'
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