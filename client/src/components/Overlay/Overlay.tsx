import React from 'react'

interface txtProp {
  text: string;
  width?: string | number
  color?: string
  backgroundColor?: string
}
const Overlay = ({ text , width=172.99 , color='#7444FD' , backgroundColor='#7444FD26' }: txtProp) => {
  return (
       <div
      style={{ width , color , backgroundColor }}
      className="h-9 rounded-[100px] py-1  flex justify-evenly items-center font-[Urbanist]"
    >
      <p className="text-[16px] leading-7 tracking-[-0.32px]  font-medium">
        {text}
      </p>
    </div>
  )
}

export default Overlay

