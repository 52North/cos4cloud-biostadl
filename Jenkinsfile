pipeline {
  agent {
    docker {
      image 'node:alpine3.10'
      args '-p 3000:3000'
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