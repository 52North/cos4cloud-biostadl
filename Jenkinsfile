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
        sh 'echo ${WORKSPACE}/biostadl'
      }
    }

  }
}