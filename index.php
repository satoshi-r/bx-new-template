<?php $path = "local/templates/main/"; ?>
<?php include_once 'local/templates/main/header.php'; ?>

<div class="main-page">
	<picture>
    <source type="image/webp" srcset="<?php echo $path; ?>img/preview.webp">
    <source type="image/jpeg" srcset="<?php echo $path; ?>img/preview.jpg">
    <img src="<?php echo $path; ?>img/preview.jpg" alt="preview">
  </picture>
</div>

<?php include_once 'local/templates/main/footer.php'; ?>