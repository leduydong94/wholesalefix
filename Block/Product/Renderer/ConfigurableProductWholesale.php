<?php
namespace Bss\ConfigurableProductWholesaleFix\Block\Product\Renderer;

use Magento\Framework\Serialize\Serializer\Json;
use Magento\Swatches\Block\Product\Renderer\Configurable;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Helper\Product as CatalogProduct;
use Magento\ConfigurableProduct\Helper\Data;
use Magento\ConfigurableProduct\Model\ConfigurableAttributeData;
use Magento\Customer\Helper\Session\CurrentCustomer;
use Magento\Framework\Json\EncoderInterface;
use Magento\Framework\Pricing\PriceCurrencyInterface;
use Magento\Framework\Stdlib\ArrayUtils;
use Magento\Swatches\Helper\Data as SwatchData;
use Magento\Swatches\Helper\Media;
use Bss\ConfigurableProductWholesale\Helper\Data as WholesaleData;
use Magento\CatalogInventory\Api\StockStateInterface;
use Magento\CatalogInventory\Model\Spi\StockRegistryProviderInterface;
use Magento\Catalog\Model\ProductRepository;
use Magento\Eav\Model\ResourceModel\Entity\Attribute\Option\CollectionFactory;
use Magento\ConfigurableProduct\Model\Product\Type\Configurable as ConfigurableProductType;
use Bss\ConfigurableProductWholesale\Model\ConfigurableData;
use Bss\ConfigurableProductWholesale\Model\Table\DataList;
use Bss\ConfigurableProductWholesale\Helper\MagentoHelper;

/**
 * @SuppressWarnings(PHPMD.CouplingBetweenObjects)
 */
class ConfigurableProductWholesale extends \Bss\ConfigurableProductWholesale\Block\Product\Renderer\ConfigurableProductWholesale
{
    /**
     * Template of product has swatches
     */
    const WHOLESALE_SWATCHES_TEMPLATE = 'product/view/renderer.phtml';

    /**
     * Template of normal product
     */
    const WHOLESALE_TEMPLATE = 'product/view/configurable.phtml';

    /**
     * @var WholesaleData
     */
    private $helperBss;

    /**
     * @var StockStateInterface
     */
    private $stockState;

    /**
     * @var StockRegistryProviderInterface
     */
    private $stockRegistryProvider;

    /**
     * @var ProductRepository
     */
    private $productRepository;

    /**
     * @var /Magento\CatalogInventory\Api\StockRegistryInterface
     */
    public $stockRegistry;

    /**
     * @var CollectionFactory
     */
    private $attrOptionCollectionFactory;

    /**
     * @var ConfigurableProductType
     */
    private $configurableProductType;

    /**
     * @var ConfigurableData
     */
    private $configurableData;

    /**
     * @var ConfigurableData
     */
    private $dataList;

    /**
     * @var Json
     */
    private $serialize;

    /**
     * @var MagentoHelper
     */
    protected $magentoHelper;

    /**
     * ConfigurableProductWholesale constructor.
     * @param Context $context
     * @param ArrayUtils $arrayUtils
     * @param EncoderInterface $jsonEncoder
     * @param Data $helper
     * @param CatalogProduct $catalogProduct
     * @param CurrentCustomer $currentCustomer
     * @param PriceCurrencyInterface $priceCurrency
     * @param ConfigurableAttributeData $configurableAttributeData
     * @param SwatchData $swatchHelper
     * @param Media $swatchMediaHelper
     * @param StockStateInterface $stockState
     * @param StockRegistryProviderInterface $stockRegistryProvider
     * @param ProductRepository $productRepository
     * @param WholesaleData $helperBss
     * @param CollectionFactory $attrOptionCollectionFactory
     * @param ConfigurableProductType $configurableProductType
     * @param ConfigurableData $configurableData
     * @param DataList $dataList
     * @param Json $serialize
     * @param MagentoHelper $magentoHelper
     * @param array $data
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        Context $context,
        ArrayUtils $arrayUtils,
        EncoderInterface $jsonEncoder,
        Data $helper,
        CatalogProduct $catalogProduct,
        CurrentCustomer $currentCustomer,
        PriceCurrencyInterface $priceCurrency,
        ConfigurableAttributeData $configurableAttributeData,
        SwatchData $swatchHelper,
        Media $swatchMediaHelper,
        StockStateInterface $stockState,
        StockRegistryProviderInterface $stockRegistryProvider,
        ProductRepository $productRepository,
        WholesaleData $helperBss,
        CollectionFactory $attrOptionCollectionFactory,
        ConfigurableProductType $configurableProductType,
        ConfigurableData $configurableData,
        DataList $dataList,
        Json $serialize,
        MagentoHelper $magentoHelper,
        array $data = []
    ) {
        parent::__construct(
            $context,
            $arrayUtils,
            $jsonEncoder,
            $helper,
            $catalogProduct,
            $currentCustomer,
            $priceCurrency,
            $configurableAttributeData,
            $swatchHelper,
            $swatchMediaHelper,
            $stockState,
            $stockRegistryProvider,
            $productRepository,
            $helperBss,
            $attrOptionCollectionFactory,
            $configurableProductType,
            $configurableData,
            $dataList,
            $serialize,
            $magentoHelper,
            $data
        );
        $this->helperBss = $helperBss;
        $this->stockState = $stockState;
        $this->stockRegistryProvider = $stockRegistryProvider;
        $this->productRepository = $productRepository;
        $this->attrOptionCollectionFactory = $attrOptionCollectionFactory;
        $this->configurableProductType = $configurableProductType;
        $this->configurableData = $configurableData;
        $this->dataList = $dataList;
        $this->serialize = $serialize;
        $this->magentoHelper = $magentoHelper;
    }

    /**
     * Return renderer template wholesale
     *
     * @return string
     */
    public function getRendererTemplate()
    {
        if ($this->helperBss->isModuleEnabled()) {
            if ($this->helperBss->validateMagentoVersion('2.1.6')) {
                $hasSwatch = $this->isProductHasSwatchAttribute();
            } else {
                $hasSwatch = $this->isProductHasSwatchAttribute;
            }
            if ($hasSwatch) {
                return self::WHOLESALE_SWATCHES_TEMPLATE;
            } else {
                return 'product/view/renderer.phtml';
            }
        } else {
            return parent::getRendererTemplate();
        }
    }

    /**
     * @return mixed
     */
    public function getShowSwatchTooltip() {
        return $this->helperBss->getShowSwatchTooltip();
    }
}
