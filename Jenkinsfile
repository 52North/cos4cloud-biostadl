pipeline {
  agent {
    docker {
      image 'node:6-alpine'
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