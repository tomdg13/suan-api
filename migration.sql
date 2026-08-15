CREATE TABLE IF NOT EXISTS logistics_provider (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500) NULL,
  type ENUM('logistic', 'customer_courier', 'store_pickup') NOT NULL DEFAULT 'logistic',
  logo_url VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO logistics_provider (name, description, type, sort_order) VALUES
('Anousith Logistic', 'ຈັດສົ່ງໂດຍລົດສົ່ງ Anousith Logistic', 'logistic', 1),
('ຈັດສົ່ງມາຕະຖານ', 'ຈັດສົ່ງມາຕະຖານຣອດທີ່ຢູ່ຂອງທ່ານ', 'customer_courier', 2),
('ຮັບສິນຄ້າດ້ວຍຕົນເອງ', 'ມາຮັບສິນຄ້າດ້ວຍຕົນເອງທີ່ຮ້ານ', 'store_pickup', 3);
