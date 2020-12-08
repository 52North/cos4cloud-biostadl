pipeline {
  agent none
  stages {
    stage('Biostadl Data Loader') {
      stages {
        stage('Build Data Loader') {
          steps {            
            dir('biostadl') {
              echo 'Installing node dependencies'
              sh 'npm install'
              
              echo 'cleanup'
              sh 'npm run clean'
              
            }

          }
        }
        
        stage('Build') {

          steps {            
            dir('biostadl') {
              echo 'Building loader'
              sh 'npm run build'
            }
          }
        }
      }
    }

  }
}
