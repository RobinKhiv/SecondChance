import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class SecondChanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'SecondChanceVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create RDS Instance
    const dbInstance = new rds.DatabaseInstance(this, 'SecondChanceDB', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0
      }),
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      databaseName: 'secondchance',
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Create Lambda Function
    const apiFunction = new lambda.Function(this, 'SecondChanceAPI', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../backend'),
      vpc,
      environment: {
        DATABASE_HOST: dbInstance.instanceEndpoint.hostname,
        DATABASE_NAME: 'secondchance',
        DATABASE_USER: 'admin',
        DATABASE_PASSWORD: dbInstance.secret!.secretValue.toString(),
        NODE_ENV: 'production'
      },
    });

    // Grant Lambda access to RDS
    dbInstance.grantConnect(apiFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'SecondChanceAPIGateway', {
      restApiName: 'SecondChance API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Add Lambda integration
    const integration = new apigateway.LambdaIntegration(apiFunction);
    api.root.addProxy({
      defaultIntegration: integration,
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'APIUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
} 