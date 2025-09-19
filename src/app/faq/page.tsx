'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Users, CreditCard, Calendar, MapPin } from 'lucide-react'

const faqData = [
  {
    category: "대회 참가",
    icon: <Calendar className="h-5 w-5" />,
    items: [
      {
        question: "대회 참가 신청은 어떻게 하나요?",
        answer: "웹사이트의 '런텐 대회' 메뉴에서 원하는 대회를 선택하고 '참가신청' 버튼을 클릭하세요. 개인정보 입력 후 참가비를 결제하면 신청이 완료됩니다."
      },
      {
        question: "참가 자격에 제한이 있나요?",
        answer: "대부분의 대회는 만 18세 이상이면 누구나 참가 가능합니다. 단, 하프마라톤과 풀마라톤은 만 20세 이상, 의료진 소견서가 필요한 경우도 있으니 각 대회의 상세 안내를 확인해 주세요."
      },
      {
        question: "대회 당일 준비물은 무엇인가요?",
        answer: "신분증(필수), 참가번호표, 러닝화, 적절한 운동복, 개인 물병을 준비해 주세요. 대회에 따라 추가 준비물이 있을 수 있으니 참가 안내 메일을 확인해 주세요."
      },
      {
        question: "날씨가 나빠도 대회가 진행되나요?",
        answer: "소우 정도의 비는 대회가 진행됩니다. 단, 태풍, 폭우, 폭설 등 안전에 위험이 있는 경우에는 대회가 취소되거나 연기될 수 있습니다. 취소 시에는 참가비 전액을 환불해 드립니다."
      }
    ]
  },
  {
    category: "참가비 및 환불",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: "참가비는 얼마인가요?",
        answer: "대회별, 거리별로 참가비가 다릅니다. 일반적으로 5K: 2만원, 10K: 3만원, 하프마라톤: 4만원, 풀마라톤: 5만원입니다. 조기 신청 시 할인 혜택이 있으니 대회별 상세 정보를 확인해 주세요."
      },
      {
        question: "참가비 환불 규정이 어떻게 되나요?",
        answer: "대회 30일 전 100%, 15일 전 50%, 7일 전 30% 환불 가능하며, 7일 이내에는 환불이 불가능합니다. 의료진 소견서, 군 입대 등 특별한 사유가 있는 경우 별도 규정을 적용합니다."
      },
      {
        question: "결제 방법은 어떤 것들이 있나요?",
        answer: "신용카드, 계좌이체, 무통장입금이 가능합니다. 온라인 결제 시에는 신용카드와 계좌이체를 이용하실 수 있고, 무통장입금을 원하시는 경우 별도 안내를 받으실 수 있습니다."
      },
      {
        question: "환불은 언제 처리되나요?",
        answer: "신용카드 결제 시 3-5영업일, 계좌이체 시 5-7영업일이 소요됩니다. 특별 환불의 경우 서류 검토 후 7-10영업일이 걸릴 수 있습니다."
      }
    ]
  },
  {
    category: "대회 운영",
    icon: <MapPin className="h-5 w-5" />,
    items: [
      {
        question: "대회는 어디서 열리나요?",
        answer: "전국 각지의 공원, 강변, 해안가 등에서 대회가 열립니다. 서울 한강공원, 부산 해운대, 제주 올레길 등 경치 좋은 코스에서 진행되며, 각 대회별 상세 위치와 교통편은 참가 안내에서 확인 가능합니다."
      },
      {
        question: "대회 시작 시간은 몇 시인가요?",
        answer: "계절에 따라 다르지만, 여름철에는 오전 6시, 겨울철에는 오전 8시에 시작하는 것이 일반적입니다. 정확한 시간은 각 대회별로 다르므로 참가 안내를 확인해 주세요."
      },
      {
        question: "대회 중 급수소는 있나요?",
        answer: "5K 이상의 모든 대회에서는 코스 중간과 완주 지점에 급수소를 운영합니다. 물과 이온음료를 제공하며, 30도 이상의 더운 날씨에는 급수소를 추가로 설치합니다."
      },
      {
        question: "완주 증명서나 기록증은 받을 수 있나요?",
        answer: "모든 완주자에게 완주증을 발급해 드립니다. 10K 이상 대회에서는 개인 기록이 포함된 기록증도 함께 제공하며, 웹사이트에서 디지털 완주증을 다운로드할 수도 있습니다."
      }
    ]
  },
  {
    category: "회원 및 기타",
    icon: <Users className="h-5 w-5" />,
    items: [
      {
        question: "회원가입을 해야만 참가할 수 있나요?",
        answer: "아니오, 회원가입 없이도 대회 참가가 가능합니다. 다만 회원으로 가입하시면 대회 정보를 우선 안내받고, 포인트 적립 등의 혜택을 받으실 수 있습니다."
      },
      {
        question: "참가 신청 후 정보를 수정할 수 있나요?",
        answer: "네, 대회 7일 전까지는 '신청조회' 메뉴에서 개인정보를 수정하실 수 있습니다. 단, 참가 종목 변경은 해당 종목에 여석이 있는 경우에만 가능합니다."
      },
      {
        question: "단체 참가 할인이 있나요?",
        answer: "10명 이상 단체 참가 시 10% 할인, 30명 이상 시 15% 할인 혜택이 있습니다. 단체 신청을 원하시면 대회 시작 15일 전까지 고객센터로 연락주시기 바랍니다."
      },
      {
        question: "대회 사진은 어떻게 받을 수 있나요?",
        answer: "대회 종료 후 3-5일 내에 홈페이지에 대회 사진이 업로드됩니다. 개인별 사진은 참가번호로 검색하여 무료로 다운로드 받으실 수 있습니다."
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<{[key: string]: boolean}>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleItem = (category: string, index: number) => {
    const key = `${category}-${index}`
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const filteredData = selectedCategory 
    ? faqData.filter(category => category.category === selectedCategory)
    : faqData

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">자주 묻는 질문</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            RUN10 이용 시 궁금한 사항들을 확인해보세요
          </p>
        </div>
      </section>

      {/* FAQ 내용 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 카테고리 필터 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">카테고리별 질문</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === null 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span>전체</span>
              </button>
              {faqData.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    selectedCategory === category.category 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  {category.icon}
                  <span>{category.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ 리스트 */}
          <div className="space-y-8">
            {filteredData.map((category) => (
              <div key={category.category} className="bg-white rounded-lg shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    {category.icon}
                    <span>{category.category}</span>
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {category.items.map((item, index) => {
                    const key = `${category.category}-${index}`
                    const isOpen = openItems[key]
                    
                    return (
                      <div key={index} className="p-6">
                        <button
                          onClick={() => toggleItem(category.category, index)}
                          className="w-full text-left flex justify-between items-start space-x-4 hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                        >
                          <h4 className="text-lg font-medium text-gray-900 flex-1">
                            Q. {item.question}
                          </h4>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="mt-4 pl-6 border-l-4 border-red-200">
                            <p className="text-gray-700 leading-relaxed">
                              A. {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 추가 문의 안내 */}
          <div className="mt-16 bg-red-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">원하는 답변을 찾지 못하셨나요?</h3>
            <p className="text-gray-700 mb-6">
              추가 문의사항이 있으시면 언제든지 고객센터로 연락주세요. 
              빠르고 정확한 답변을 드리겠습니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border">
                📞 02-1234-5678
              </div>
              <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border">
                📧 info@run10.kr
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}