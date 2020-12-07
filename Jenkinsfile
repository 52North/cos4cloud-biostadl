pipeline {
  agent none
  stages {
    stage('Build Loader') {
      agent {
        docker {
          args '-u "node"'
          image 'node:14-alpine'
        }

      }
      steps {
        sh '''cd biostadl
npm install
npm run build'''
      }
    }

  }
}