pipeline {
  agent none
  stages {
    stage('Biostadl Data Loader') {
      agent {
        docker {
          image: 'node:14-alpine'
        }
      }
      stages {
        stage('Build Data Loader') {
          
          steps {            
            dir('${WORKSPACE}/biostadl') {
              echo 'Installing node dependencies'
              sh 'npm install'
              
              echo 'cleanup'
              sh 'npm run clean'
              
            }

          }
        }
        
        stage('Build') {

          steps {            
            dir('${WORKSPACE}/biostadl') {
              echo 'Building loader'
              sh 'npm run build'
            }
          }
        }
      }
    }

  }
}
