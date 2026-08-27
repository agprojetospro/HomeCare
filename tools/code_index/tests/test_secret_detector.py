from pathlib import Path
import unittest
from tools.code_index.scanner.secret_detector import SecretDetector


class TestSecretDetector(unittest.TestCase):
    def test_secret_filenames(self):
        self.assertTrue(SecretDetector.is_secret_file(Path(".env"))[0])
        self.assertTrue(SecretDetector.is_secret_file(Path(".env.local"))[0])
        self.assertTrue(SecretDetector.is_secret_file(Path(".env.production"))[0])
        self.assertTrue(SecretDetector.is_secret_file(Path("server.key"))[0])
        self.assertTrue(SecretDetector.is_secret_file(Path("cert.pem"))[0])
        self.assertTrue(SecretDetector.is_secret_file(Path("id_rsa"))[0])

        self.assertFalse(SecretDetector.is_secret_file(Path("app.tsx"))[0])
        self.assertFalse(SecretDetector.is_secret_file(Path("schema.sql"))[0])

    def test_secret_content(self):
        self.assertTrue(
            SecretDetector.contains_secrets("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...")[0]
        )
        self.assertTrue(
            SecretDetector.contains_secrets("api_key = 'abcdefghijklmnopqrstuvwxyz12345'")[0]
        )
        self.assertTrue(
            SecretDetector.contains_secrets("const token = 'ghp_123456789012345678901234567890123456'")[0]
        )

        self.assertFalse(
            SecretDetector.contains_secrets("export function calculateAge(birthDate: Date): number { return 0; }")[0]
        )


if __name__ == "__main__":
    unittest.main()
