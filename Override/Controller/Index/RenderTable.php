<?php
namespace Bss\ConfigurableProductWholesaleFix\Override\Controller\Index;

use Bss\ConfigurableProductWholesale\Model\ConfigurableData;
use Magento\Catalog\Model\ProductRepository;
use Magento\Catalog\Model\ResourceModel\Eav\AttributeFactory;
use Magento\ConfigurableProduct\Model\Product\Type\Configurable;
use Magento\Framework\App\Action;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Serialize\Serializer\Json;

class RenderTable extends \Bss\ConfigurableProductWholesale\Controller\Index\RenderTable
{
    /**
     * @var ProductRepository
     */
    private $productRepository;

    /**
     * @var Configurable
     */
    private $configurableProductType;

    /**
     * @var ConfigurableData
     */
    private $configurableData;

    /**
     * @param Action\Context $context
     * @param ProductRepository $productRepository
     * @param Configurable $configurableProductType
     * @param AttributeFactory $eavModel
     * @param ConfigurableData $configurableData
     * @param Json $serialize
     * @param JsonFactory $resultJsonFactory
     */
    public function __construct(
        Action\Context $context,
        ProductRepository $productRepository,
        Configurable $configurableProductType,
        AttributeFactory $eavModel,
        ConfigurableData $configurableData,
        Json $serialize,
        JsonFactory $resultJsonFactory
    ) {
        $this->productRepository = $productRepository;
        $this->configurableProductType = $configurableProductType;
        $this->configurableData = $configurableData;
        parent::__construct(
            $context,
            $productRepository,
            $configurableProductType,
            $eavModel,
            $configurableData,
            $serialize,
            $resultJsonFactory
        );
    }

    /**
     * @return mixed
     */
    public function execute()
    {
        if (!$this->getRequest()->isAjax()) {
            return $this->_redirect('noroute');
        }

        $resultJson = $this->resultJsonFactory->create();
        $data = $this->getRequest()->getParam('options');
        $options = $this->serialize->unserialize($data);
        $productId = $options['productId'];
        $product = $this->productRepository->getById($productId);
        $childProducts = $this->configurableProductType->getUsedProductCollection($product)
            ->addAttributeToSelect('*');
        if (!empty($options['option'])) {
            foreach ($options['option'] as $option) {
                $attr = explode('_', $option);
                $attributeCode = $this->loadAttributeCode($attr);
                $childProducts->addAttributeToFilter($attributeCode, $attr[1]);
            }
        } else {
            $attributes =  $this->configurableProductType->getConfigurableAttributesAsArray($product);
            $firstAttr = reset($attributes);
            foreach ($firstAttr['values'] as $value) {
                $childProducts->addAttributeToFilter(
                    $firstAttr['attribute_code'],
                    $value['value_index']
                );
            }
        }

        $mergedIds = $childProducts->getAllIds();
        $jsonChildInfo = $this->configurableData->getJsonChildInfo($product, $mergedIds);
        return $resultJson->setJsonData(
            $jsonChildInfo
        );
    }
}
