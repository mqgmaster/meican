##CONFIGURATION GUIDE

This step is set some parameters in order to configure the application.

###PARAMETERS

Location: config/params.php

Located on certificates folder on project root, the application certificate must be defined:

```
'certificate.filename' => 'meican.pem',
'certificate.pass' => '#CERTIFICATE-PASSWORD#',    
```

By default the fake provider is enabled. Disable this feature setting the param below:

```
'provider.force.dummy' => false,
```

For the pass recovery form, the application uses the [Google reCAPTCHA API](https://www.google.com/recaptcha). The keys must be set:

```
'google.recaptcha.secret.key' => '',
'google.recaptcha.site.key' => '',
```

The feedback system requires a valid destination email and a valid SMTP server:

```
'mailer.destination' => 'meican@example.com',
```

The SMTP server is defined in a separated file. It requires a host, user and password.

Location: config/mailer.php

```
'host' => '',
'username' => '',
'password' => '',
```

###APPLICATION NSA ID

We need set the MEICAN NSA ID to identify that application by other NSI providers. Access the application and enter to Reservations > Configuration and set the MEICAN NSA ID field with a valid id:

```
urn:ogf:network:#DOMAIN#:#YEAR#:nsa:meican
```

###DEFAULT PROVIDER

If the fake provider has been disabled, we need to define a real provider to receive the MEICAN requests. On the same configuration page (Reservations > Configuration) you can set the Provider NSA ID and the URL of the Connection Service.
