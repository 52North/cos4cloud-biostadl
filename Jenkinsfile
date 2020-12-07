pipeline {
  agent any
  stages {
    stage('Build Loader') {
      agent {
        docker {
          image 'node:14-alpine'
          args '-u node'
        }

      }
      steps {
        sh 'cd ${WORKSPACE}/biostadl'
        sh 'npm install'
        sh 'npm run build'
      }
    }

  }
}