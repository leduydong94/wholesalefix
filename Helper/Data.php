<?php
namespace Bss\ConfigurableProductWholesaleFix\Helper;

use Magento\ConfigurableProduct\Model\Product\Type\Configurable as ConfigurableType;
use Magento\Store\Model\ScopeInterface;
use Bss\ConfigurableProductWholesale\Helper\MagentoHelper;

class Data extends \Bss\ConfigurableProductWholesale\Helper\Data
{
    const CONFIGURABLE_PRODUCT_TYPE = 'configurable';

    /**
     * @var array
     */
    protected $arrProductTierPrice = [];

    /**
     * @var \Magento\Framework\Locale\FormatInterface
     */
    private $localeFormat;

    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    public $scopeConfig;

    /**
     * @var \Magento\Framework\App\ProductMetadataInterface
     */
    private $productMetadata;

    /**
     * @var \Magento\Framework\Filter\LocalizedToNormalized
     */
    private $localFilter;

    /**
     * @var \Magento\Framework\Locale\ResolverInterface
     */
    private $localeResolver;

    /**
     * @var MagentoHelper
     */
    protected $magentoHelper;

    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $session;

    /**
     * @param \Magento\Framework\App\Helper\Context $context
     * @param \Magento\Framework\App\ProductMetadataInterface $productMetadata
     * @param \Magento\Framework\Filter\LocalizedToNormalized $localFilter
     * @param \Magento\Framework\Locale\Currency $currencyLocale
     * @param \Magento\Framework\Locale\FormatInterface $localeFormat
     * @param \Magento\Framework\Locale\ResolverInterface $localeResolver
     * @param \Magento\Framework\Registry $registry
     * @param \Magento\Framework\Serialize\Serializer\Json $serializer
     * @param MagentoHelper $magentoHelper
     * @param \Magento\Customer\Model\Session $session
     */
    public function __construct(
        \Magento\Framework\App\Helper\Context $context,
        \Magento\Framework\App\ProductMetadataInterface $productMetadata,
        \Magento\Framework\Filter\LocalizedToNormalized $localFilter,
        \Magento\Framework\Locale\FormatInterface $localeFormat,
        \Magento\Framework\Locale\ResolverInterface $localeResolver,
        MagentoHelper $magentoHelper,
        \Magento\Customer\Model\SessionFactory $session
    ) {
        parent::__construct(
            $context,
            $productMetadata,
            $localFilter,
            $localeFormat,
            $localeResolver,
            $magentoHelper,
            $session
        );
        $this->localeFormat = $localeFormat;
        $this->productMetadata = $productMetadata;
        $this->magentoHelper = $magentoHelper;
        $this->localFilter = $localFilter;
        $this->localeResolver = $localeResolver;
        $this->session = $session;
    }

    /**
     * Get config if swatch tooltips should be rendered.
     *
     * @return string
     */
    public function getShowSwatchTooltip()
    {
        return $this->scopeConfig->getValue(
            'catalog/frontend/show_swatch_tooltip',
            ScopeInterface::SCOPE_STORE
        );
    }
}
