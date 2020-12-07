pipeline {
  agent {
    docker {
      image 'node:14-alpine'
      args '-u "node"'
    }

  }
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