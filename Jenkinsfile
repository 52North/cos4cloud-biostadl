pipeline {
  agent any
  stages {
    stage('Build Loader') {
      steps {
        sh 'cd biostadl'
        sh 'npm install'
        sh 'npm run build'
      }
    }

  }
}