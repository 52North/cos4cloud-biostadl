pipeline {
  agent none
  stages {

    stage('Data Loader') {
      agent {
        docker {
          image 'node:14-alpine'
        }

      }
      stages {
        stage('Init') {
          steps 
            echo 'Initialize'
            dir(path: 'biostadl') {
              sh 'npm install'
              sh 'npm run clean'
            }
          }
        }

        stage('Build') {
          steps {
            dir(path: 'biostadl') {
              echo 'Build'
              sh 'npm run build'
            }
          }
        }


      }
    }

  }
  environment {
    HOME = '.'
  }
}
