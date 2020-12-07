pipeline {
  agent {
    node {
      label 'Jenkins'
    }

  }
  stages {
    stage('Build Loader') {
      steps {
        sh '''cd biostadl
npm run build'''
      }
    }

  }
}