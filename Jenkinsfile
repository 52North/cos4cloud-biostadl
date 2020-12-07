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
        echo 'Hello World'
        dir(path: 'biostadl') {
          sh '''#!/usr/bin/sh
echo $(pwd)'''
        }

      }
    }

  }
}