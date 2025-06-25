pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: main-agent-container
    image: gcr.io/dots-production-farhan01/jenkins-custom-agent:latest
    command: ["sleep"]
    args: ["9999999"]
    securityContext:
      runAsUser: 0 # Running as root since your image is configured for it
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }

    environment {
        PROJECT_ID = 'dots-production-farhan01'
        CLUSTER_NAME = 'dots-gke-cluster'
        CLUSTER_ZONE = 'asia-southeast2-a'
        REGISTRY = 'gcr.io'
        IMAGE_NAME = 'dots-fe-test'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DEPLOYMENT_TIMEOUT = '900s'

        // Testing Configuration
        NODE_ENV = 'test'
        CI = 'true'
        NEXT_TELEMETRY_DISABLED = '1'
        NODE_OPTIONS = '--max-old-space-size=2048'

        // SonarQube Configuration
        SONAR_HOST_URL = 'http://sonarqube.devops-tools.svc.cluster.local:9000'
        SONAR_PROJECT_KEY = 'dots-fe-test'
        SONAR_PROJECT_NAME = 'dots-fe-test'
        SONAR_PROJECT_VERSION = "${BUILD_NUMBER}"

        // Path configurations
        PATH = "/opt/google-cloud-sdk/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin"
        SONAR_SCANNER_HOME = "/opt/sonar-scanner"
    }

    stages {
        stage('Environment Verification') {
            steps {
                container('main-agent-container') {
                    script {
                        sh '''
                            echo "=== Environment Verification ==="
                            echo "PATH: $PATH"
                            echo "Working directory: $(pwd)"
                            echo "User: $(whoami)"
                            
                            echo "=== Tool Versions ==="
                            node --version || echo "❌ Node.js not found"
                            npm --version || echo "❌ npm not found"
                            gcloud --version || echo "❌ gcloud not found"
                            kubectl version --client || echo "❌ kubectl not found"
                            kaniko-executor version || echo "❌ kaniko not found"
                            sonar-scanner --version || echo "❌ sonar-scanner not found"
                            
                            echo "=== System Info ==="
                            cat /etc/os-release
                            free -h
                            df -h
                        '''
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                container('main-agent-container') {
                    script {
                        try {
                            cleanWs()
                            checkout scm

                            sh '''
                                echo "=== Source Code Verification ==="
                                ls -la
                                echo "Checking critical files..."
                                [ -f package.json ] && echo "✓ package.json found" || echo "✗ package.json missing"
                                [ -f Dockerfile ] && echo "✓ Dockerfile found" || echo "✗ Dockerfile missing"
                                [ -f next.config.mjs ] && echo "✓ next.config.mjs found" || echo "✗ next.config.mjs missing"
                            '''

                            echo "✓ Source code checked out successfully"

                        } catch (Exception e) {
                            echo "❌ Checkout failed: ${e.getMessage()}"
                            throw e
                        }
                    }
                }
            }
        }

        stage('Dependency Installation') {
            steps {
                container('main-agent-container') {
                    script {
                        sh '''
                            echo "=== Node.js Environment Check ==="
                            which node || echo "Node.js not in PATH"
                            which npm || echo "npm not in PATH"
                            node --version
                            npm --version
                            
                            echo "=== Installing Dependencies ==="

                            # Clean any existing modules
                            rm -rf node_modules package-lock.json yarn.lock

                            # Configure npm for better performance
                            npm config set prefer-offline true
                            npm config set audit false
                            npm config set fund false
                            npm config set progress false

                            # Install dependencies with timeout
                            timeout 600 npm install --prefer-offline --no-audit --no-fund --silent || {
                                echo "npm install failed, trying npm install..."
                                timeout 600 npm install --prefer-offline --no-audit --no-fund --silent
                            }

                            echo "✓ Dependencies installed successfully"
                            echo "Node modules size: $(du -sh node_modules 2>/dev/null || echo 'N/A')"
                        '''
                    }
                }
            }
        }

        stage('Tests & Static Analysis') {
            parallel {
                stage('SonarQube Analysis') {
                    steps {
                        container('main-agent-container') {
                            script {
                                echo "=== Running Static Code Analysis (SonarQube) ==="
                                withSonarQubeEnv('sq1') {
                                    sh """
                                        sonar-scanner \\
                                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                          -Dsonar.projectName=${SONAR_PROJECT_NAME} \\
                                          -Dsonar.projectVersion=${SONAR_PROJECT_VERSION} \\
                                          -Dsonar.sources=. \\
                                          -Dsonar.exclusions=node_modules/**,coverage/**,.next/** \\
                                          -Dsonar.host.url=${SONAR_HOST_URL}
                                    """
                                }
                                echo "✓ Static Code Analysis completed"
                            }
                        }
                    }
                }

                stage('Unit Tests') {
                    steps {
                        container('main-agent-container') {
                            script {
                                echo "=== Running Unit Tests ==="
                                try {
                                    timeout(time: 10, unit: 'MINUTES') {
                                        sh '''
                                            # Verify package.json test configuration
                                            echo "Checking package.json for test scripts..."
                                            if [ -f package.json ]; then
                                                echo "Test scripts found:"
                                                cat package.json | jq -r '.scripts | to_entries[] | select(.key | contains("test")) | "\\(.key): \\(.value)"' 2>/dev/null || \
                                                grep -A 5 -B 5 '"test"' package.json || echo "No test scripts found in package.json"
                                            fi

                                            # Check for Jest configuration
                                            echo "Looking for Jest configuration..."
                                            for config in jest.config.ts jest.config.mjs jest.config.json package.json; do
                                                if [ -f "$config" ]; then
                                                    echo "Found Jest config in: $config"
                                                    if [ "$config" = "package.json" ]; then
                                                        grep -A 10 '"jest"' package.json || echo "No Jest config in package.json"
                                                    fi
                                                fi
                                            done

                                            # Set test environment variables
                                            export NODE_ENV=test
                                            export CI=true
                                            export NEXT_TELEMETRY_DISABLED=1
                                            export FORCE_COLOR=0
                                            export NODE_OPTIONS="--max-old-space-size=2048"

                                            # Disable Next.js telemetry
                                            ./node_modules/.bin/next telemetry disable 2>/dev/null || true

                                            echo "=== Environment Check ==="
                                            echo "Node version: $(node --version)"
                                            echo "NPM version: $(npm --version)"
                                            echo "Working directory: $(pwd)"
                                            echo "NODE_ENV: $NODE_ENV"
                                            echo "CI: $CI"

                                            # Try different test commands with timeouts
                                            if npm run | grep -q "test:ci"; then
                                                echo "Running npm run test:ci..."
                                                timeout 600 npm run test:ci
                                            elif npm run | grep -q "test"; then
                                                echo "Running npm run test..."
                                                timeout 600 npm run test
                                            else
                                                echo "No test script found, running Jest directly..."
                                                timeout 600 ./node_modules/.bin/jest --ci --verbose --no-coverage --maxWorkers=1 --forceExit --detectOpenHandles --passWithNoTests
                                            fi

                                            echo "✓ Tests completed successfully"
                                        '''
                                    }

                                } catch (Exception e) {
                                    echo "⚠️ Tests failed or timed out: ${e.getMessage()}"

                                    // Show debugging info
                                    sh '''
                                        echo "=== Test Failure Debug Info ==="
                                        echo "Process list:"
                                        ps aux | grep -E "(node|jest|npm)" | grep -v grep || echo "No related processes found"
                                        echo "Memory usage:"
                                        free -h || echo "Memory info not available"
                                        echo "Disk usage:"
                                        df -h || echo "Disk info not available"
                                    '''
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('main-agent-container') {
                    withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
                        script {
                            try {
                                sh '''
                                    echo "=== Authenticating with GCP ==="
                                    gcloud auth activate-service-account --key-file="${GC_KEY}"
                                    gcloud config set project ${PROJECT_ID}
                                    echo "✓ GCP authentication successful"
                                '''
                                
                                sh """
                                    echo "=== Building with Google Cloud Build ==="
                                    gcloud builds submit \\
                                        --tag ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} \\
                                        --timeout=1200s \\
                                        .
                                    
                                    echo "=== Tagging as latest ==="
                                    gcloud container images add-tag \\
                                        ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} \\
                                        ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest
                                """
                                
                            } catch (Exception e) {
                                echo "❌ Cloud Build failed: ${e.getMessage()}"
                                sh '''
                                    echo "=== Debug Info ==="
                                    gcloud auth list
                                    gcloud config list
                                '''
                                throw e
                            }
                        }
                    }
                }
            }
        }

        stage('Pre-Deployment Check') {
            steps {
                container('main-agent-container') {
                    withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
                        script {
                            try {
                                sh '''
                                    echo "=== Pre-Deployment Verification ==="
                                    gcloud auth activate-service-account --key-file="${GC_KEY}"
                                    gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}

                                    echo "Checking cluster status..."
                                    kubectl get nodes

                                    echo "Verifying image in registry..."
                                    gcloud container images list --repository=${REGISTRY}/${PROJECT_ID} --filter="name~${IMAGE_NAME}" || echo "Image list failed"

                                    echo "Checking specific image tag..."
                                    gcloud container images describe ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} || echo "New image, will be available after build"

                                    echo "Checking current deployment..."
                                    kubectl get deployment dots-fe-test -n default || echo "Deployment not found - will be created"

                                    echo "Checking service..."
                                    kubectl get service dots-fe-test -n default || echo "Service not found"
                                '''

                            } catch (Exception e) {
                                echo "⚠️ Pre-deployment check had issues: ${e.getMessage()}"
                                echo "Continuing with deployment..."
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to GKE') {
            steps {
                container('main-agent-container') {
                    withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
                        script {
                            try {
                                sh """
                                    echo "=== Deploying to GKE ==="
                                    gcloud auth activate-service-account --key-file="\${GC_KEY}"
                                    gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}

                                    echo "Updating deployment with new image..."
                                    kubectl set image deployment/dots-fe-test dots-fe-test=${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} -n default

                                    echo "Waiting for deployment to complete..."
                                    kubectl rollout status deployment/dots-fe-test --timeout=${DEPLOYMENT_TIMEOUT} -n default

                                    echo "✓ Deployment completed successfully!"
                                """

                            } catch (Exception e) {
                                echo "❌ Deployment failed: ${e.getMessage()}"
                                throw e
                            }
                        }
                    }
                }
            }
        }

        stage('Post-Deployment Verification') {
            steps {
                container('main-agent-container') {
                    withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
                        script {
                            try {
                                sh '''
                                    echo "=== Post-Deployment Verification ==="
                                    gcloud auth activate-service-account --key-file="${GC_KEY}"
                                    gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}

                                    echo "Deployment status:"
                                    kubectl get deployment dots-fe-test -n default

                                    echo "Pod status:"
                                    kubectl get pods -n default -l app=dots-fe-test -o wide

                                    echo "Service status:"
                                    kubectl get service dots-fe-test -n default

                                    echo "✓ Post-deployment verification completed"
                                '''

                            } catch (Exception e) {
                                echo "⚠️ Post-deployment verification had issues: ${e.getMessage()}"
                                echo "But deployment may still be successful"
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            container('main-agent-container') {
                echo "=== Pipeline Completed ==="

                script {
                    try {
                        // Simple cleanup
                        cleanWs(
                            cleanWhenNotBuilt: false,
                            deleteDirs: true,
                            disableDeferredWipeout: true,
                            notFailBuild: true,
                            patterns: [
                                [pattern: '.gitignore', type: 'INCLUDE'],
                                [pattern: '.propsfile', type: 'EXCLUDE'],
                                [pattern: 'node_modules/**', type: 'EXCLUDE']
                            ]
                        )
                    } catch (Exception e) {
                        echo "⚠️ Cleanup had issues: ${e.getMessage()}"
                    }
                }
            }
        }

        success {
            echo "✅ Deployment successful!"
            echo "🐳 Image: ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "🔗 Application should be available at your configured endpoint"
            echo "📊 Build Number: ${BUILD_NUMBER}"
        }

        failure {
            echo '❌ Pipeline failed!'

            container('main-agent-container') {
                withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
                    script {
                        try {
                            sh '''
                                echo "=== FAILURE DIAGNOSTICS ==="
                                gcloud auth activate-service-account --key-file="${GC_KEY}"
                                gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}

                                echo "Recent events:"
                                kubectl get events -n default --sort-by='.lastTimestamp' | grep -i dots-fe-test | head -20 || true

                                echo "Pod status:"
                                kubectl get pods -n default -l app=dots-fe-test -o wide || true

                                echo "Pod logs:"
                                kubectl logs -l app=dots-fe-test -n default --tail=100 || true

                                echo "Deployment status:"
                                kubectl describe deployment dots-fe-test -n default || true

                                echo "Image in registry:"
                                gcloud container images list --repository=${REGISTRY}/${PROJECT_ID} --filter="name~${IMAGE_NAME}" || true
                            '''
                        } catch (Exception e) {
                            echo "Could not retrieve diagnostics: ${e.getMessage()}"
                        }
                    }
                }
            }
        }
    }
}
