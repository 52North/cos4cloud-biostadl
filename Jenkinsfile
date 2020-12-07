pipeline {
  agent {
    docker {
      image 'node:14-alpine'
    }

  }
  stages {
    stage('Build Loader') {
      agent {
        docker {
          image 'node:14-alpine'
        }

      }
      steps {
        sh 'cd biostadl'
        sh 'npm install'
        sh 'npm run build'
      }
    }

  }
}