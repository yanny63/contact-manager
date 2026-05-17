import Login from './auth/login'
import Register from './auth/register'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import '../css/auth.css'
import { AnimatePresence, motion, transform, translateAxis } from 'framer-motion'

function Auth({ lightMode }) {

    const { type } = useParams()

    return (
        <div className='auth'>
            {/* { type === 'login' ? <Login lightMode={lightMode} /> : <Register lightMode={lightMode} />} */}
            <AnimatePresence mode='wait'>
                { type === 'login' ? (
                    <motion.div
                    key='login'
                    className='auth-inner'
                    initial={{ transform: 'translateX(-80px)', opacity: 0 }}
                    animate={{ transform: 'translateX(0px)', opacity: 1 }}
                    exit={{ transform: 'translateX(-80px)', opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                        <div className='gradient-container isGradient left'>

                        </div>
                        <Login lightMode={lightMode} />
                    </motion.div>
                ) : (
                    <motion.div
                    key='register'
                    className='auth-inner'
                    initial={{ transform: 'translateX(80px)', opacity: 0 }}
                    animate={{ transform: 'translateX(0px)', opacity: 1 }}
                    exit={{ transform: 'translateX(80px)', opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                        <div className='gradient-container isGradient right'>

                        </div>
                        <Register lightMode={lightMode} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Auth