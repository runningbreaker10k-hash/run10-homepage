'use client'

import { useState } from 'react'
import { FileText, AlertTriangle } from 'lucide-react'

interface ConsentFormProps {
  onAgree: () => void
  onDisagree: () => void
}

export default function ConsentForm({ onAgree, onDisagree }: ConsentFormProps) {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">참가 동의서</h2>
          </div>
          <p className="mt-2 text-gray-600">
            대회 참가 신청 전에 아래 동의서를 반드시 읽고 동의해 주세요.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">주의사항</p>
                <p>본 동의서는 참가자의 안전과 권리를 보호하기 위한 중요한 내용을 포함하고 있습니다.</p>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-lg font-medium text-gray-900 mb-4">1. 개인정보 수집 및 이용 동의</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p className="mb-2"><strong>수집하는 개인정보 항목:</strong></p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>필수항목: 성명, 생년월일, 성별, 주소, 연락처, 이메일, 기념품 사이즈, 입금자명</li>
                <li>선택항목: 특이사항</li>
              </ul>
              <p className="mb-2"><strong>개인정보 수집 및 이용 목적:</strong></p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>대회 참가 신청 접수 및 관리</li>
                <li>참가비 입금 확인 및 관리</li>
                <li>기념품 배송 및 대회 관련 공지사항 전달</li>
                <li>대회 운영 및 안전 관리</li>
              </ul>
              <p className="mb-2"><strong>개인정보 보유 및 이용 기간:</strong></p>
              <p>대회 종료 후 1년간 보관 후 파기</p>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">2. 대회 참가 관련 동의</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
              <p><strong>가. 건강 상태 확인</strong></p>
              <p>본인은 현재 건강 상태가 양호하며, 러닝 대회 참가에 지장이 없음을 확인합니다.</p>
              
              <p><strong>나. 안전 수칙 준수</strong></p>
              <p>대회 참가 중 주최측의 안전 수칙 및 지시사항을 준수할 것을 동의합니다.</p>
              
              <p><strong>다. 책임의 한계</strong></p>
              <p>대회 참가 중 발생할 수 있는 부상이나 사고에 대해 참가자 본인의 부주의로 인한 경우 
              주최측의 책임이 제한될 수 있음을 이해합니다.</p>
              
              <p><strong>라. 대회 규정 준수</strong></p>
              <p>대회 규정 및 운영 방침을 준수하며, 이를 위반할 경우 참가 자격이 박탈될 수 있음을 동의합니다.</p>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">3. 촬영 및 초상권 동의</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p>대회 진행 과정에서 촬영된 사진 및 영상이 대회 홍보 및 기록 목적으로 
              사용될 수 있음에 동의합니다. 이러한 자료는 웹사이트, SNS, 언론 매체 등에 활용될 수 있습니다.</p>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">4. 참가비 환불 규정</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
              <p><strong>환불 가능 기간:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>대회 7일 전까지: 전액 환불 (수수료 제외)</li>
                <li>대회 3일 전까지: 50% 환불</li>
                <li>대회 3일 이내: 환불 불가</li>
              </ul>
              <p><strong>환불 불가 사유:</strong> 개인 사정, 날씨, 기타 불가항력적 사유</p>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">5. 기타 사항</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
              <p>• 대회 당일 신분증을 지참해야 하며, 본인 확인이 되지 않을 경우 참가가 제한될 수 있습니다.</p>
              <p>• 기념품(티셔츠)은 신청 시 선택한 사이즈로 제공되며, 변경이 어려울 수 있습니다.</p>
              <p>• 대회 일정 및 코스는 기상 상황이나 기타 사정에 따라 변경될 수 있습니다.</p>
              <p>• 참가 신청 후 정보 변경이나 문의사항은 대회 문의처로 연락해 주세요.</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start mb-6">
            <input
              id="consent-check"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="consent-check" className="ml-3 text-sm text-gray-700 cursor-pointer">
              <span className="font-medium">위 내용을 모두 읽고 이해했으며, 이에 동의합니다.</span>
              <br />
              <span className="text-gray-500">
                개인정보 수집 및 이용, 대회 참가 규정, 촬영 동의, 환불 규정에 모두 동의합니다.
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onDisagree}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              동의하지 않음
            </button>
            <button
              type="button"
              onClick={onAgree}
              disabled={!isChecked}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              동의하고 신청하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}