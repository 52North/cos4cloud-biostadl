pipeline {
  agent {
    docker {
      image 'node:6-alpine'
    }

  }
  stages {
    stage('Build Loader') {
      steps {
        sh '''cd biostadl;
echo $(pwd);
npm install;
npm run build;'''
      }
    }

  }
}